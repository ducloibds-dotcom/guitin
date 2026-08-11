/* =========================================================
   SERVICE WORKER — guitin.678.vn (Gửi mail hàng loạt C15V18)
   ---------------------------------------------------------
   Khác với sw.js của app "dangtin":
   • Tên cache riêng (guitin-c15v18) — không đụng cache app khác
   • Precache cả "/" và "/index.html", không chỉ mỗi sw.js
   • CHỈ cache GET cùng origin (trang tĩnh) — bỏ qua hoàn toàn
     mọi request POST và mọi request khác domain (kenyo-email,
     dongbomokhoa...). Vì đây là app gửi mail/đồng bộ dữ liệu,
     nếu lỡ cache API thì có thể gửi lại dữ liệu cũ/sai từ cache.
   ---------------------------------------------------------
   Khi ra bản mới (C15V19...): đổi CACHE bên dưới → bản cũ tự
   bị xoá ở bước "activate", không cần làm gì thêm.
========================================================= */
var CACHE  = "guitin-c15v18";
var ASSETS = ["/", "/index.html", "/sw.js"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // .catch để 1 asset lỗi (vd chưa deploy xong) không làm hỏng cả install
      return c.addAll(ASSETS).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  var req = e.request;

  // Chỉ xử lý GET cùng origin (trang/asset tĩnh của guitin.678.vn).
  // Bỏ qua POST và mọi request sang domain khác (kenyo-email
  // worker, dongbomokhoa worker...) — để trình duyệt tự fetch
  // bình thường, không qua Service Worker.
  var sameOrigin = new URL(req.url).origin === self.location.origin;
  if (req.method !== "GET" || !sameOrigin) return;

  e.respondWith(
    caches.match(req).then(function (cached) {
      return (
        cached ||
        fetch(req).then(function (resp) {
          if (resp && resp.status === 200) {
            var clone = resp.clone();
            caches.open(CACHE).then(function (c) { c.put(req, clone); });
          }
          return resp;
        })
      );
    })
  );
});
