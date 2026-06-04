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

const de_alerts_emptyactive1 = /** @type {(inputs: Alerts_Emptyactive1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Du bist auf dem neuesten Stand!`)
};

const ar_alerts_emptyactive1 = /** @type {(inputs: Alerts_Emptyactive1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت على اطلاع!`)
};

const fr_alerts_emptyactive1 = /** @type {(inputs: Alerts_Emptyactive1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes à jour !`)
};

const ko_alerts_emptyactive1 = /** @type {(inputs: Alerts_Emptyactive1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모두 확인했습니다!`)
};

/**
* | output |
* | --- |
* | "You're all caught up!" |
*
* @param {Alerts_Emptyactive1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_emptyactive1 = /** @type {((inputs?: Alerts_Emptyactive1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Emptyactive1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_emptyactive1(inputs)
	if (locale === "es") return es_alerts_emptyactive1(inputs)
	if (locale === "de") return de_alerts_emptyactive1(inputs)
	if (locale === "ar") return ar_alerts_emptyactive1(inputs)
	if (locale === "fr") return fr_alerts_emptyactive1(inputs)
	return ko_alerts_emptyactive1(inputs)
});
export { alerts_emptyactive1 as "alerts.emptyActive" }