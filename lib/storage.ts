// 보관함 내용이 바뀌는 동작(상점 구매, 배송 신청 등) 이후 이 이벤트를 dispatch하면
// useStorage를 쓰는 모든 곳(네브바·마이페이지 배지 등)이 보관함을 다시 불러온다.
export const STORAGE_UPDATED_EVENT = 'storage-updated'

export function notifyStorageUpdated() {
  window.dispatchEvent(new Event(STORAGE_UPDATED_EVENT))
}
