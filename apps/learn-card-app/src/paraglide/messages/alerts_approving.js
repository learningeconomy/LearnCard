/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_ApprovingInputs */

const en_alerts_approving = /** @type {(inputs: Alerts_ApprovingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approving...`)
};

const es_alerts_approving = /** @type {(inputs: Alerts_ApprovingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobando...`)
};

const de_alerts_approving = /** @type {(inputs: Alerts_ApprovingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird genehmigt...`)
};

const ar_alerts_approving = /** @type {(inputs: Alerts_ApprovingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الموافقة...`)
};

const fr_alerts_approving = /** @type {(inputs: Alerts_ApprovingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approbation...`)
};

const ko_alerts_approving = /** @type {(inputs: Alerts_ApprovingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`승인 중...`)
};

/**
* | output |
* | --- |
* | "Approving..." |
*
* @param {Alerts_ApprovingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_approving = /** @type {((inputs?: Alerts_ApprovingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ApprovingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_approving(inputs)
	if (locale === "es") return es_alerts_approving(inputs)
	if (locale === "de") return de_alerts_approving(inputs)
	if (locale === "ar") return ar_alerts_approving(inputs)
	if (locale === "fr") return fr_alerts_approving(inputs)
	return ko_alerts_approving(inputs)
});
export { alerts_approving as "alerts.approving" }