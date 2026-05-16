# 📦 Export Management System (EMS)

> 수출 물류 데이터를 통합 관리하는 사내 웹 기반 시스템  
> 한국 본사와 미국 지사 간 수출 물류 데이터를 실시간으로 공유하고 관리합니다.

---

## 🛠 Tech Stack

| 구분 | 기술 |
|------|------|
| Frontend | React, JavaScript |
| Backend | Python, Flask |
| Database | MSSQL |
| Server | Windows Server, IIS (온프레미스) |

---

## 📌 주요 기능

### 📋 Invoice Tracking
INV#와 품목번호를 기반으로 ETD·ETA 및 출하 수량을 자동 조회하고, 인보이스·재고·출하 정보를 통합 확인할 수 있습니다.

<img width="1908" height="1033" alt="Image" src="https://github.com/user-attachments/assets/742a5981-22b1-475e-9cc2-9e03147a70a0" />

---

### 📦 Packing List 관리
인보이스별 Packing List를 등록하고 PO번호, 거래처, 품번, 품명, 수량 등을 관리합니다.

<img width="1910" height="1033" alt="Image" src="https://github.com/user-attachments/assets/d7977c61-7388-42ac-ad95-09e8bc6eb2dc" />

---

### 🗄️ 품목 관리
품목번호, 품명, 업체명, 규격, 재질, 형태, 유형, 단위 등 품목 정보를 통합 관리합니다.

<img width="1912" height="990" alt="Image" src="https://github.com/user-attachments/assets/219dc737-2471-4246-9965-67dc27370a9c" />

---

### 📊 재고실사 관리
실사 재고와 운송 중 수량을 각각 확인하고, 적정재고 기준으로 발주 필요 여부를 판단합니다.

<img width="1912" height="985" alt="Image" src="https://github.com/user-attachments/assets/a4cd5e06-098f-4b01-8fd6-328913c29ff6" />

---

### 📈 원소재 재고 파악 및 운송일정 관리
과부족 상태와 운송 스케줄을 한눈에 확인하고, 실사재고·운항중 수량·정상재고를 통합 판단합니다.

<img width="1910" height="916" alt="Image" src="https://github.com/user-attachments/assets/a3d6dc96-918d-4bce-b36f-16b03478ae47" />

---

### 🚢 해상 운임 관리
BUSAN–SAVANNAH, BUSAN–LA, BUSAN–MOBILE 노선별 운임 데이터를 관리하고, THC·CFS·서류비·ISF 등 세부 항목 단위로 입력 및 관리합니다.

<img width="640" height="348" alt="Image" src="https://github.com/user-attachments/assets/e742d58f-7da3-4422-b23b-d9f9c13ffa1c" />

---

### 📊 운임 추이 그래프
연월 단위로 기간을 지정해 노선별 운임 변동 추이를 시각화합니다.

<img width="640" height="344" alt="Image" src="https://github.com/user-attachments/assets/9289a941-049a-4f80-8d5c-c762d8168c48" />

---

## 🏗 시스템 구조

```
frontend/     (React)
backend/      (Flask)
├── app.py
├── routes/
├── models.py
└── config.py
```

---

## 🔧 배포 환경

- Windows Server 온프레미스 환경에 직접 배포
- IIS URL Rewrite를 통한 프록시 설정
- 사내 ERP 서버 내부망 연동

---

## 🏅 주요 성과

- 한국 본사·미국 지사 간 엑셀 파일 교환 없이 실시간 데이터 공유 가능
- 인보이스·재고·출하 정보 연계 확인으로 업무 처리 정확성 향상
- 노선별 운임 추이 시각화로 물류 비용 분석 및 의사결정 지원
