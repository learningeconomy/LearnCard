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

const fr_launchpad_actions_issuecredential1 = /** @type {(inputs: Launchpad_Actions_Issuecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre une accréditation`)
};

const ar_launchpad_actions_issuecredential1 = /** @type {(inputs: Launchpad_Actions_Issuecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار بيانات اعتماد`)
};

/**
* | output |
* | --- |
* | "Issue Credential" |
*
* @param {Launchpad_Actions_Issuecredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_issuecredential1 = /** @type {((inputs?: Launchpad_Actions_Issuecredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Issuecredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_issuecredential1(inputs)
	if (locale === "es") return es_launchpad_actions_issuecredential1(inputs)
	if (locale === "fr") return fr_launchpad_actions_issuecredential1(inputs)
	return ar_launchpad_actions_issuecredential1(inputs)
});
export { launchpad_actions_issuecredential1 as "launchpad.actions.issueCredential" }