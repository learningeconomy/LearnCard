/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Importcredentials1Inputs */

const en_launchpad_actions_importcredentials1 = /** @type {(inputs: Launchpad_Actions_Importcredentials1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import Credentials`)
};

const es_launchpad_actions_importcredentials1 = /** @type {(inputs: Launchpad_Actions_Importcredentials1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar credenciales`)
};

const de_launchpad_actions_importcredentials1 = /** @type {(inputs: Launchpad_Actions_Importcredentials1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigungen importieren`)
};

const ar_launchpad_actions_importcredentials1 = /** @type {(inputs: Launchpad_Actions_Importcredentials1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد بيانات الاعتماد`)
};

const fr_launchpad_actions_importcredentials1 = /** @type {(inputs: Launchpad_Actions_Importcredentials1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer des accréditations`)
};

const ko_launchpad_actions_importcredentials1 = /** @type {(inputs: Launchpad_Actions_Importcredentials1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격 증명 가져오기`)
};

/**
* | output |
* | --- |
* | "Import Credentials" |
*
* @param {Launchpad_Actions_Importcredentials1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_importcredentials1 = /** @type {((inputs?: Launchpad_Actions_Importcredentials1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Importcredentials1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_importcredentials1(inputs)
	if (locale === "es") return es_launchpad_actions_importcredentials1(inputs)
	if (locale === "de") return de_launchpad_actions_importcredentials1(inputs)
	if (locale === "ar") return ar_launchpad_actions_importcredentials1(inputs)
	if (locale === "fr") return fr_launchpad_actions_importcredentials1(inputs)
	return ko_launchpad_actions_importcredentials1(inputs)
});
export { launchpad_actions_importcredentials1 as "launchpad.actions.importCredentials" }