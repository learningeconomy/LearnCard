/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Createcredential1Inputs */

const en_launchpad_actions_createcredential1 = /** @type {(inputs: Launchpad_Actions_Createcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Credential`)
};

const es_launchpad_actions_createcredential1 = /** @type {(inputs: Launchpad_Actions_Createcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear credencial`)
};

const de_launchpad_actions_createcredential1 = /** @type {(inputs: Launchpad_Actions_Createcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigung erstellen`)
};

const ar_launchpad_actions_createcredential1 = /** @type {(inputs: Launchpad_Actions_Createcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء بيانات اعتماد`)
};

const fr_launchpad_actions_createcredential1 = /** @type {(inputs: Launchpad_Actions_Createcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une accréditation`)
};

const ko_launchpad_actions_createcredential1 = /** @type {(inputs: Launchpad_Actions_Createcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격 증명 만들기`)
};

/**
* | output |
* | --- |
* | "Create Credential" |
*
* @param {Launchpad_Actions_Createcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_createcredential1 = /** @type {((inputs?: Launchpad_Actions_Createcredential1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Createcredential1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_createcredential1(inputs)
	if (locale === "es") return es_launchpad_actions_createcredential1(inputs)
	if (locale === "de") return de_launchpad_actions_createcredential1(inputs)
	if (locale === "ar") return ar_launchpad_actions_createcredential1(inputs)
	if (locale === "fr") return fr_launchpad_actions_createcredential1(inputs)
	return ko_launchpad_actions_createcredential1(inputs)
});
export { launchpad_actions_createcredential1 as "launchpad.actions.createCredential" }