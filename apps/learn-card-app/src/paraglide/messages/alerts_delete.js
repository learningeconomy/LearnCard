/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_DeleteInputs */

const en_alerts_delete = /** @type {(inputs: Alerts_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete`)
};

const es_alerts_delete = /** @type {(inputs: Alerts_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const de_alerts_delete = /** @type {(inputs: Alerts_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Löschen`)
};

const ar_alerts_delete = /** @type {(inputs: Alerts_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف`)
};

const fr_alerts_delete = /** @type {(inputs: Alerts_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const ko_alerts_delete = /** @type {(inputs: Alerts_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`삭제`)
};

/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Alerts_DeleteInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_delete = /** @type {((inputs?: Alerts_DeleteInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_DeleteInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_delete(inputs)
	if (locale === "es") return es_alerts_delete(inputs)
	if (locale === "de") return de_alerts_delete(inputs)
	if (locale === "ar") return ar_alerts_delete(inputs)
	if (locale === "fr") return fr_alerts_delete(inputs)
	return ko_alerts_delete(inputs)
});
export { alerts_delete as "alerts.delete" }