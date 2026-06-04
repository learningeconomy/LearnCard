/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Issuecredential1Inputs */

const en_launchpad_actions_issuecredential1 = /** @type {(inputs: Launchpad_Actions_Issuecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Credential`)
};

const es_launchpad_actions_issuecredential1 = /** @type {(inputs: Launchpad_Actions_Issuecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir credencial`)
};

const de_launchpad_actions_issuecredential1 = /** @type {(inputs: Launchpad_Actions_Issuecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigung ausstellen`)
};

const ar_launchpad_actions_issuecredential1 = /** @type {(inputs: Launchpad_Actions_Issuecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار بيانات اعتماد`)
};

const fr_launchpad_actions_issuecredential1 = /** @type {(inputs: Launchpad_Actions_Issuecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre une accréditation`)
};

const ko_launchpad_actions_issuecredential1 = /** @type {(inputs: Launchpad_Actions_Issuecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격 증명 발급`)
};

/**
* | output |
* | --- |
* | "Issue Credential" |
*
* @param {Launchpad_Actions_Issuecredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_issuecredential1 = /** @type {((inputs?: Launchpad_Actions_Issuecredential1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Issuecredential1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_issuecredential1(inputs)
	if (locale === "es") return es_launchpad_actions_issuecredential1(inputs)
	if (locale === "de") return de_launchpad_actions_issuecredential1(inputs)
	if (locale === "ar") return ar_launchpad_actions_issuecredential1(inputs)
	if (locale === "fr") return fr_launchpad_actions_issuecredential1(inputs)
	return ko_launchpad_actions_issuecredential1(inputs)
});
export { launchpad_actions_issuecredential1 as "launchpad.actions.issueCredential" }