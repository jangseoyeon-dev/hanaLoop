# PCF — 제품 탄소발자국 산정 시스템

활동 데이터(전력·자재·운송)와 **버전 관리되는 배출계수**를 곱해 탄소배출량(PCF)을
산정하고, 대시보드로 시각화하는 웹 애플리케이션입니다.

> `탄소배출량 = 활동량(amount) × 활성 배출계수(factor)`

🔗 **배포 주소**: https://hana-loop-okgh.vercel.app/

- **데이터 관리**: 활동 데이터 등록 / 엑셀 일괄 업로드 / 중복 감지 / 산정 근거 조회
- **배출계수 관리**: 활동별 배출계수의 버전 이력 관리, 활성 버전 전환·수정·삭제 시 PCF 자동 재계산
- **대시보드**: 총배출량, 유형별·월별 추이, 상위 활동 차트와 필터링

> **소요시간**: 약 18~20시간 (2일)

---

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| 스타일 | Tailwind CSS v4 |
| 데이터 | PostgreSQL 16, Prisma ORM 6 |
| 차트/UI | Chart.js, react-modal, sonner(toast), zustand |
| 엑셀 | xlsx |
| 인프라 | Docker Compose (PostgreSQL) |

---

## 로컬 실행 방법

> 사전 요구사항: **Node.js 20+**, **pnpm**, **Docker**

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 파일 생성 (기본값이 docker-compose 설정과 일치)
cp .env.example .env

# 3. DB 컨테이너 기동 → 스키마 마이그레이션 → 시드 데이터 주입
pnpm db:up && pnpm prisma:migrate && pnpm prisma:generate 

# 4. 프로덕션 빌드
pnpm build

# 5. 서버 실행 → http://localhost:3000
pnpm start
```

> 개발 모드로 띄우려면 4·5단계 대신 `pnpm dev` 하나로 실행할 수 있습니다.

### 자주 쓰는 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버(HMR) |
| `pnpm db:up` / `pnpm db:down` | PostgreSQL 컨테이너 시작 / 종료 |
| `pnpm prisma:studio` | Prisma Studio(DB GUI) |
| `pnpm prisma:reset` | DB 초기화 후 마이그레이션·시드 재실행 |

---

## 시스템 설계

### 도메인 모델

```
ActivityType (활동 유형: 전력/자재/운송)
   ├─ ActivityData     (활동 데이터: 발생일·활동량·단위)
   └─ EmissionFactor   (배출계수: factor·version·isActive)
                              │
ActivityData × EmissionFactor → PcfResult (carbonEmission)
UploadHistory (엑셀 업로드 이력) ─┐
                                 └─ ActivityData
```

| 모델 | 역할 |
| --- | --- |
| `ActivityType` | 활동 유형 마스터. `category`(ELECTRICITY/MATERIAL/TRANSPORT) 보유 |
| `ActivityData` | 개별 활동 기록. `rowHash`로 중복 후보 표시(`isDuplicate`) |
| `EmissionFactor` | 활동별 배출계수. **버전 관리**되며 활동당 1개만 `isActive` |
| `PcfResult` | 활동 데이터 × 활성 배출계수로 산출된 탄소배출량 |
| `UploadHistory` | 엑셀 일괄 업로드 단위 이력 |

### 핵심 설계 포인트

- **배출계수 버전 관리 & 재계산**: 활동당 활성 버전은 항상 1개. 활성 버전을
  전환·수정·삭제하면 해당 활동의 모든 `PcfResult`를 새 계수로 재계산합니다.
  최소 1개 버전은 삭제 불가로 무결성을 보장합니다.
- **중복 감지**: 활동 데이터의 주요 필드를 해시(`rowHash`)해 동일 행을 중복 후보로
  플래그하고, 집계(대시보드)에서는 제외합니다.
- **데이터 흐름**: 조회는 **서버 컴포넌트에서 Prisma로 직접** 수행하고(`force-dynamic`),
  생성·수정·삭제 등 변경은 **API Route(`/api/*`)** 를 통해 처리한 뒤 `router.refresh()`로
  서버 상태를 갱신합니다.

### 폴더 구조 (페이지별 colocate)

라우트별로 필요한 컴포넌트·로직을 Next.js **private 폴더**(`_components`, `_lib`)에
함께 두고, 2개 이상 페이지가 공유하는 것만 `shared/`로 승격하는 구조입니다.

```
src/
├─ app/
│  ├─ (dashboard)/                # 대시보드 (URL: "/")
│  │  ├─ page.tsx
│  │  ├─ _components/             # TotalCard, EmptyState, charts/, TypeCard
│  │  └─ _lib/                    # queries.ts, types.ts
│  ├─ data-management/            # 데이터 관리 (/data-management)
│  │  ├─ page.tsx
│  │  ├─ _components/             # table/, modal/, button/
│  │  └─ _lib/                    # upload.ts, types.ts
│  ├─ emission-factors/           # 배출계수 관리 (/emission-factors)
│  │  ├─ page.tsx
│  │  ├─ _components/             # table/, modal/(활성·수정·삭제), button/
│  │  └─ _lib/types.ts
│  └─ api/                        # 서버 API (Route Handlers)
│     ├─ activity-data/(route, bulk)
│     ├─ activity-types/
│     ├─ emission-factors/(route, [id])
│     └─ dashboard/summary/
└─ shared/                        # 공통 모듈
   ├─ components/
   │  ├─ table/                   # 제네릭 DataTable<T>, Pagination, Th
   │  ├─ filter/                  # FilterBox + 공통 필터 타입(FilterValues)
   │  ├─ card/StatTile.tsx
   │  └─ layout/                  # Header, Sidebar
   ├─ lib/                        # prisma, format, hash, category, emission
   └─ stores/                     # zustand(sidebar)
```

대표적인 공통 컴포넌트로 **제네릭 `DataTable<T>`** (컬럼 설정 기반, 페이지네이션·빈
상태 내장)가 있어 데이터 관리·배출계수 테이블이 동일한 골격을 공유합니다.

### API 요약

| 메서드 & 경로 | 설명 |
| --- | --- |
| `GET /api/activity-types` | 활동 유형 목록 |
| `GET /api/activity-data` | 활동 데이터 조회(필터) |
| `POST /api/activity-data` | 활동 데이터 단건 등록 |
| `POST /api/activity-data/bulk` | 엑셀 파싱 결과 일괄 등록 |
| `GET /api/emission-factors` | 배출계수 목록 |
| `POST /api/emission-factors` | 배출계수 버전 추가 |
| `PATCH /api/emission-factors/[id]` | 활성 전환 / factor·단위 수정 (PCF 재계산) |
| `DELETE /api/emission-factors/[id]` | 버전 삭제 (활성 승계 + 재계산) |
| `GET /api/dashboard/summary` | 대시보드 집계(총량·유형별·월별·상위 활동) |

---

## AI 도구 사용 내역

본 프로젝트는 **Claude Code (Anthropic)** 를 활용해 개발했습니다.

| 도구 | 모델 | 활용 내용 |
| --- | --- | --- |
| Claude Code | Claude (Opus) | 코드 구현 보조 및 아키텍처 리팩터링 |

주요 활용 작업:

- **구조 리팩터링**: 기존 `features/` 기반 구조를 페이지별 colocate 구조
  (`app/<route>/_components`·`_lib`)로 재편하고, 대시보드를 `(dashboard)` 라우트 그룹으로 이동
- **공통 컴포넌트 추출**: 필터 타입(`FilterValues`), 통계 타일(`StatTile`),
  제네릭 테이블(`DataTable<T>`)을 `shared/`로 분리
- **컴포넌트 분리**: 배출계수 페이지의 인라인 모달(활성 전환·수정·삭제)을 별도
  표현 컴포넌트로 분리
- 코드 리뷰·타입 점검·빌드 검증 보조

> 모든 AI 생성·수정 코드는 직접 검토하고 빌드·타입체크로 검증한 뒤 반영했습니다.
