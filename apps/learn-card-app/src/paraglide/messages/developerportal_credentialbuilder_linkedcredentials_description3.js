/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Linkedcredentials_Description3Inputs */

const en_developerportal_credentialbuilder_linkedcredentials_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`These are pre-signed verifiable credentials embedded in this CLR. They are read-only and will be preserved as-is in the output.`)
};

const es_developerportal_credentialbuilder_linkedcredentials_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estas son credenciales verificables prefirmadas incrustadas en este CLR. Son de solo lectura y se conservarán tal cual en la salida.`)
};

const fr_developerportal_credentialbuilder_linkedcredentials_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce sont des crédentials vérifiables pré-signés intégrés dans ce CLR. Ils sont en lecture seule et seront conservés tels quels dans la sortie.`)
};

const ar_developerportal_credentialbuilder_linkedcredentials_description3 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذه اعتمادات قابلة للتحقق موقعة مسبقًا مضمنة في CLR هذا. وهي للقراءة فقط وستُحفظ كما هي في المخرجات.`)
};

/**
* | output |
* | --- |
* | "These are pre-signed verifiable credentials embedded in this CLR. They are read-only and will be preserved as-is in the output." |
*
* @param {Developerportal_Credentialbuilder_Linkedcredentials_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_linkedcredentials_description3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Linkedcredentials_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Linkedcredentials_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_linkedcredentials_description3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_linkedcredentials_description3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_linkedcredentials_description3(inputs)
	return ar_developerportal_credentialbuilder_linkedcredentials_description3(inputs)
});
export { developerportal_credentialbuilder_linkedcredentials_description3 as "developerPortal.credentialBuilder.linkedCredentials.description" }