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

const fr_alerts_confirmdelete1 = /** @type {(inputs: Alerts_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer cette notification ?`)
};

const ar_alerts_confirmdelete1 = /** @type {(inputs: Alerts_Confirmdelete1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف هذا الإشعار؟`)
};

/**
* | output |
* | --- |
* | "Delete this notification?" |
*
* @param {Alerts_Confirmdelete1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_confirmdelete1 = /** @type {((inputs?: Alerts_Confirmdelete1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Confirmdelete1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_confirmdelete1(inputs)
	if (locale === "es") return es_alerts_confirmdelete1(inputs)
	if (locale === "fr") return fr_alerts_confirmdelete1(inputs)
	return ar_alerts_confirmdelete1(inputs)
});
export { alerts_confirmdelete1 as "alerts.confirmDelete" }