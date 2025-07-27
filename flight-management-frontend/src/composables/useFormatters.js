import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr'; // Türkçe dil desteği (opsiyonel)

// Gerekli eklentileri dayjs'e ekle
dayjs.extend(relativeTime);
dayjs.locale('tr'); // Dili Türkçe olarak ayarla

/**
 * Proje genelinde veri formatlama fonksiyonları sağlayan bir composable.
 * @returns {object} Formatlama fonksiyonlarını içeren bir nesne.
 */
export function useFormatters() {
  /**
   * Bir tarih değerini 'DD.MM.YYYY' formatına çevirir.
   * @param {string | Date} date - Formatlanacak tarih.
   * @returns {string} Formatlanmış tarih veya geçersizse boş string.
   */
  const formatDate = (date) => {
    if (!date) return '';
    return dayjs(date).format('DD.MM.YYYY');
  };

  /**
   * Bir tarih-saat değerini 'DD.MM.YYYY HH:mm' formatına çevirir.
   * @param {string | Date} dateTime - Formatlanacak tarih-saat.
   * @returns {string} Formatlanmış tarih-saat veya geçersizse boş string.
   */
  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    return dayjs(dateTime).format('DD.MM.YYYY HH:mm');
  };

  /**
   * Bir tarih-saat değerini şu anki zamana göreceli olarak formatlar (örn: "5 dakika önce").
   * @param {string | Date} dateTime - Formatlanacak tarih-saat.
   * @returns {string} Göreceli zaman ifadesi veya geçersizse boş string.
   */
  const formatRelativeTime = (dateTime) => {
    if (!dateTime) return '';
    return dayjs(dateTime).fromNow();
  };

  /**
   * Bir metnin ilk harfini büyük, geri kalanını küçük yapar.
   * @param {string} str - Formatlanacak metin.
   * @returns {string} Formatlanmış metin.
   */
  const capitalize = (str) => {
    if (typeof str !== 'string' || !str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  /**
   * Bir sayıyı binlik ayraçlarla formatlar.
   * @param {number} num - Formatlanacak sayı.
   * @returns {string} Formatlanmış sayı.
   */
  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString('tr-TR');
  }

  return {
    formatDate,
    formatDateTime,
    formatRelativeTime,
    capitalize,
    formatNumber,
    dayjs // İhtiyaç halinde dayjs'in kendisini de dışarıya açabiliriz.
  };
}
