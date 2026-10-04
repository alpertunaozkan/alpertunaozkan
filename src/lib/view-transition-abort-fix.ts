/**
 * Geçici uyumluluk düzeltmesi (React 19.3 + güncel Chrome).
 *
 * Sayfa geçişi sürerken ekran boyutu değişirse (mobil adres çubuğunun açılıp
 * kapanması, cihazın döndürülmesi, geliştirici araçları) tarayıcı View
 * Transition'ı iptal eder. Bu zararsızdır: sayfa yine güncellenir, yalnızca o
 * geçiş animasyonsuz olur. React bu iptali mesajına bakarak tanır; ancak güncel
 * Chrome mesajın sonuna ". Viewport size changed" eklediği için React iptali
 * gerçek hata sanıp raporlar (geliştirme ortamında Next.js hata katmanı açılır).
 *
 * Bu betik, React'ten önce çalışarak yalnızca bu iptal mesajını React'in
 * tanıdığı biçime çevirir; diğer tüm hatalar olduğu gibi kalır. React bu
 * durumu kendisi düzelttiğinde betik kaldırılabilir (bkz. app/layout.tsx).
 */
export const VIEW_TRANSITION_ABORT_FIX = `(function () {
  var proto = window.Document && Document.prototype;
  var start = proto && proto.startViewTransition;
  if (typeof start !== "function") return;
  var ABORTED = "Transition was aborted because of invalid state";
  proto.startViewTransition = function () {
    var transition = start.apply(this, arguments);
    try {
      var ready = transition.ready.catch(function (error) {
        if (error && error.name === "InvalidStateError" && String(error.message).indexOf(ABORTED) === 0) {
          throw new DOMException(ABORTED, "InvalidStateError");
        }
        throw error;
      });
      Object.defineProperty(transition, "ready", { value: ready, configurable: true });
    } catch (e) {}
    return transition;
  };
})();`;
