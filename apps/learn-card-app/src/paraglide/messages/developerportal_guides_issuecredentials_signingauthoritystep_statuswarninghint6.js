/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarninghint6Inputs */

const en_developerportal_guides_issuecredentials_signingauthoritystep_statuswarninghint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarninghint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create one to sign credentials`)
};

const es_developerportal_guides_issuecredentials_signingauthoritystep_statuswarninghint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarninghint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea una para firmar credenciales`)
};

const fr_developerportal_guides_issuecredentials_signingauthoritystep_statuswarninghint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarninghint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez-en une pour signer des certificats`)
};

const ar_developerportal_guides_issuecredentials_signingauthoritystep_statuswarninghint6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarninghint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ واحدة لتوقيع المؤهلات`)
};

/**
* | output |
* | --- |
* | "Create one to sign credentials" |
*
* @param {Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarninghint6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_signingauthoritystep_statuswarninghint6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarninghint6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Signingauthoritystep_Statuswarninghint6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_signingauthoritystep_statuswarninghint6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_signingauthoritystep_statuswarninghint6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_signingauthoritystep_statuswarninghint6(inputs)
	return ar_developerportal_guides_issuecredentials_signingauthoritystep_statuswarninghint6(inputs)
});
export { developerportal_guides_issuecredentials_signingauthoritystep_statuswarninghint6 as "developerPortal.guides.issueCredentials.signingAuthorityStep.statusWarningHint" }