/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Preview_Description2Inputs */

const en_developerportal_credentialbuilder_preview_description2 = /** @type {(inputs: Developerportal_Credentialbuilder_Preview_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This is how your credential will appear to recipients:`)
};

const es_developerportal_credentialbuilder_preview_description2 = /** @type {(inputs: Developerportal_Credentialbuilder_Preview_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Así se verá tu credencial para los destinatarios:`)
};

const fr_developerportal_credentialbuilder_preview_description2 = /** @type {(inputs: Developerportal_Credentialbuilder_Preview_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voici à quoi ressemblera votre crédential pour les destinataires :`)
};

const ar_developerportal_credentialbuilder_preview_description2 = /** @type {(inputs: Developerportal_Credentialbuilder_Preview_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذه هي الطريقة التي سيبدو بها اعتمادك للمستلمين:`)
};

/**
* | output |
* | --- |
* | "This is how your credential will appear to recipients:" |
*
* @param {Developerportal_Credentialbuilder_Preview_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_preview_description2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Preview_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Preview_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_preview_description2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_preview_description2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_preview_description2(inputs)
	return ar_developerportal_credentialbuilder_preview_description2(inputs)
});
export { developerportal_credentialbuilder_preview_description2 as "developerPortal.credentialBuilder.preview.description" }