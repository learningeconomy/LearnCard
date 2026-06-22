/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Emptyactive1Inputs */

const en_alerts_emptyactive1 = /** @type {(inputs: Alerts_Emptyactive1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You're all caught up!`)
};

const es_alerts_emptyactive1 = /** @type {(inputs: Alerts_Emptyactive1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Estás al día!`)
};

const fr_alerts_emptyactive1 = /** @type {(inputs: Alerts_Emptyactive1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes à jour !`)
};

const ar_alerts_emptyactive1 = /** @type {(inputs: Alerts_Emptyactive1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت على اطلاع!`)
};

/**
* | output |
* | --- |
* | "You're all caught up!" |
*
* @param {Alerts_Emptyactive1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_emptyactive1 = /** @type {((inputs?: Alerts_Emptyactive1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Emptyactive1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_emptyactive1(inputs)
	if (locale === "es") return es_alerts_emptyactive1(inputs)
	if (locale === "fr") return fr_alerts_emptyactive1(inputs)
	return ar_alerts_emptyactive1(inputs)
});
export { alerts_emptyactive1 as "alerts.emptyActive" }