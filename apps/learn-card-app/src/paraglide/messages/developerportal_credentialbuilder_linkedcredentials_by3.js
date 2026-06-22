/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Credentialbuilder_Linkedcredentials_By3Inputs */

const en_developerportal_credentialbuilder_linkedcredentials_by3 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_By3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`by ${i?.name}`)
};

const es_developerportal_credentialbuilder_linkedcredentials_by3 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_By3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`por ${i?.name}`)
};

const fr_developerportal_credentialbuilder_linkedcredentials_by3 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_By3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`par ${i?.name}`)
};

const ar_developerportal_credentialbuilder_linkedcredentials_by3 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_By3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`بواسطة ${i?.name}`)
};

/**
* | output |
* | --- |
* | "by {name}" |
*
* @param {Developerportal_Credentialbuilder_Linkedcredentials_By3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_linkedcredentials_by3 = /** @type {((inputs: Developerportal_Credentialbuilder_Linkedcredentials_By3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Linkedcredentials_By3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_linkedcredentials_by3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_linkedcredentials_by3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_linkedcredentials_by3(inputs)
	return ar_developerportal_credentialbuilder_linkedcredentials_by3(inputs)
});
export { developerportal_credentialbuilder_linkedcredentials_by3 as "developerPortal.credentialBuilder.linkedCredentials.by" }