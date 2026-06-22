/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Steps_Issue2Inputs */

const en_developerportal_guides_issuecredentials_steps_issue2 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Issue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue & Verify`)
};

const es_developerportal_guides_issuecredentials_steps_issue2 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Issue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir y Verificar`)
};

const fr_developerportal_guides_issuecredentials_steps_issue2 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Issue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre et Vérifier`)
};

const ar_developerportal_guides_issuecredentials_steps_issue2 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Steps_Issue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإصدار والتحقق`)
};

/**
* | output |
* | --- |
* | "Issue & Verify" |
*
* @param {Developerportal_Guides_Issuecredentials_Steps_Issue2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_steps_issue2 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Steps_Issue2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Steps_Issue2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_steps_issue2(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_steps_issue2(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_steps_issue2(inputs)
	return ar_developerportal_guides_issuecredentials_steps_issue2(inputs)
});
export { developerportal_guides_issuecredentials_steps_issue2 as "developerPortal.guides.issueCredentials.steps.issue" }