/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Confirmdelete1Inputs */

const en_alerts_confirmdelete1 = /** @type {(inputs: Alerts_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete this notification?`)
};

const es_alerts_confirmdelete1 = /** @type {(inputs: Alerts_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Eliminar esta notificación?`)
};

const de_alerts_confirmdelete1 = /** @type {(inputs: Alerts_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Diese Benachrichtigung löschen?`)
};

const ar_alerts_confirmdelete1 = /** @type {(inputs: Alerts_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف هذا الإشعار؟`)
};

const fr_alerts_confirmdelete1 = /** @type {(inputs: Alerts_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer cette notification ?`)
};

const ko_alerts_confirmdelete1 = /** @type {(inputs: Alerts_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 알림을 삭제하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Delete this notification?" |
*
* @param {Alerts_Confirmdelete1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_confirmdelete1 = /** @type {((inputs?: Alerts_Confirmdelete1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Confirmdelete1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_confirmdelete1(inputs)
	if (locale === "es") return es_alerts_confirmdelete1(inputs)
	if (locale === "de") return de_alerts_confirmdelete1(inputs)
	if (locale === "ar") return ar_alerts_confirmdelete1(inputs)
	if (locale === "fr") return fr_alerts_confirmdelete1(inputs)
	return ko_alerts_confirmdelete1(inputs)
});
export { alerts_confirmdelete1 as "alerts.confirmDelete" }