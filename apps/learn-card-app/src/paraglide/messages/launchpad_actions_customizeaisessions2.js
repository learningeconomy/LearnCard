/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Customizeaisessions2Inputs */

const en_launchpad_actions_customizeaisessions2 = /** @type {(inputs: Launchpad_Actions_Customizeaisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Customize AI Sessions`)
};

const es_launchpad_actions_customizeaisessions2 = /** @type {(inputs: Launchpad_Actions_Customizeaisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizar sesiones de IA`)
};

const fr_launchpad_actions_customizeaisessions2 = /** @type {(inputs: Launchpad_Actions_Customizeaisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnaliser les sessions IA`)
};

const ar_launchpad_actions_customizeaisessions2 = /** @type {(inputs: Launchpad_Actions_Customizeaisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخصيص جلسات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "Customize AI Sessions" |
*
* @param {Launchpad_Actions_Customizeaisessions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_customizeaisessions2 = /** @type {((inputs?: Launchpad_Actions_Customizeaisessions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Customizeaisessions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_customizeaisessions2(inputs)
	if (locale === "es") return es_launchpad_actions_customizeaisessions2(inputs)
	if (locale === "fr") return fr_launchpad_actions_customizeaisessions2(inputs)
	return ar_launchpad_actions_customizeaisessions2(inputs)
});
export { launchpad_actions_customizeaisessions2 as "launchpad.actions.customizeAiSessions" }