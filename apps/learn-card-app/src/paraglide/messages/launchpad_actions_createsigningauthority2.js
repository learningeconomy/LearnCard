/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Createsigningauthority2Inputs */

const en_launchpad_actions_createsigningauthority2 = /** @type {(inputs: Launchpad_Actions_Createsigningauthority2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Signing Authority`)
};

const es_launchpad_actions_createsigningauthority2 = /** @type {(inputs: Launchpad_Actions_Createsigningauthority2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear autoridad de firma`)
};

const fr_launchpad_actions_createsigningauthority2 = /** @type {(inputs: Launchpad_Actions_Createsigningauthority2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une autorité de signature`)
};

const ar_launchpad_actions_createsigningauthority2 = /** @type {(inputs: Launchpad_Actions_Createsigningauthority2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Create Signing Authority" |
*
* @param {Launchpad_Actions_Createsigningauthority2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_createsigningauthority2 = /** @type {((inputs?: Launchpad_Actions_Createsigningauthority2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Createsigningauthority2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_createsigningauthority2(inputs)
	if (locale === "es") return es_launchpad_actions_createsigningauthority2(inputs)
	if (locale === "fr") return fr_launchpad_actions_createsigningauthority2(inputs)
	return ar_launchpad_actions_createsigningauthority2(inputs)
});
export { launchpad_actions_createsigningauthority2 as "launchpad.actions.createSigningAuthority" }