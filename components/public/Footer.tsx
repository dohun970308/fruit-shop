export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="container py-10 text-sm text-stone-600">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="text-base font-bold text-stone-900">🍊 과일 가게</div>
            <p className="mt-2 text-stone-600">제철 과일을 신선하게 배송해 드립니다.</p>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-stone-800">사업자 정보</div>
            <p>상호: 푸르고</p>
            <p>대표: 이석준</p>
            <p>사업자등록번호: 376-99-01711</p>
            <p>주소: 경기도 성남시 분당구 황새울로351번길 10, 401호</p>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-stone-800">고객 문의</div>
            <p>운영 시간: 평일 09:00 - 18:00</p>
          </div>
        </div>
        <div className="mt-8 border-t border-stone-200 pt-4 text-center text-xs text-stone-500">
          © {year} 과일 가게. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
