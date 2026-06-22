/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Credentialinfo_Idhelp4Inputs */

const en_developerportal_credentialbuilder_credentialinfo_idhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Idhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unique identifier for this credential (usually auto-generated)`)
};

const es_developerportal_credentialbuilder_credentialinfo_idhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Idhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identificador único de esta credencial (generalmente auto-generado)`)
};

const fr_developerportal_credentialbuilder_credentialinfo_idhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Idhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant unique de ce crédential (généralement auto-généré)`)
};

const ar_developerportal_credentialbuilder_credentialinfo_idhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Idhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف فريد لهذا الاعتماد (عادةً ما يُنشأ تلقائيًا)`)
};

/**
* | output |
* | --- |
* | "Unique identifier for this credential (usually auto-generated)" |
*
* @param {Developerportal_Credentialbuilder_Credentialinfo_Idhelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_credentialinfo_idhelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Credentialinfo_Idhelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Credentialinfo_Idhelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_credentialinfo_idhelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_credentialinfo_idhelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_credentialinfo_idhelp4(inputs)
	return ar_developerportal_credentialbuilder_credentialinfo_idhelp4(inputs)
});
export { developerportal_credentialbuilder_credentialinfo_idhelp4 as "developerPortal.credentialBuilder.credentialInfo.idHelp" }