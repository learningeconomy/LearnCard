/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_ApproveInputs */

const en_alerts_approve = /** @type {(inputs: Alerts_ApproveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approve`)
};

const es_alerts_approve = /** @type {(inputs: Alerts_ApproveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobar`)
};

const de_alerts_approve = /** @type {(inputs: Alerts_ApproveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Genehmigen`)
};

const ar_alerts_approve = /** @type {(inputs: Alerts_ApproveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موافقة`)
};

const fr_alerts_approve = /** @type {(inputs: Alerts_ApproveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approuver`)
};

const ko_alerts_approve = /** @type {(inputs: Alerts_ApproveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`승인`)
};

/**
* | output |
* | --- |
* | "Approve" |
*
* @param {Alerts_ApproveInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_approve = /** @type {((inputs?: Alerts_ApproveInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ApproveInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_approve(inputs)
	if (locale === "es") return es_alerts_approve(inputs)
	if (locale === "de") return de_alerts_approve(inputs)
	if (locale === "ar") return ar_alerts_approve(inputs)
	if (locale === "fr") return fr_alerts_approve(inputs)
	return ko_alerts_approve(inputs)
});
export { alerts_approve as "alerts.approve" }