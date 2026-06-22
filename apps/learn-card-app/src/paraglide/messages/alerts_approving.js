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

const fr_alerts_approving = /** @type {(inputs: Alerts_ApprovingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approbation...`)
};

const ar_alerts_approving = /** @type {(inputs: Alerts_ApprovingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الموافقة...`)
};

/**
* | output |
* | --- |
* | "Approving..." |
*
* @param {Alerts_ApprovingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_approving = /** @type {((inputs?: Alerts_ApprovingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ApprovingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_approving(inputs)
	if (locale === "es") return es_alerts_approving(inputs)
	if (locale === "fr") return fr_alerts_approving(inputs)
	return ar_alerts_approving(inputs)
});
export { alerts_approving as "alerts.approving" }