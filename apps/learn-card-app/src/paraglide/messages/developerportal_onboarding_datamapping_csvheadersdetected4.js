/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Datamapping_Csvheadersdetected4Inputs */

const en_developerportal_onboarding_datamapping_csvheadersdetected4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvheadersdetected4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Headers detected: ${i?.count}`)
};

const es_developerportal_onboarding_datamapping_csvheadersdetected4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvheadersdetected4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Encabezados detectados: ${i?.count}`)
};

const fr_developerportal_onboarding_datamapping_csvheadersdetected4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvheadersdetected4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`En-têtes détectés : ${i?.count}`)
};

const ar_developerportal_onboarding_datamapping_csvheadersdetected4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvheadersdetected4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم اكتشاف ${i?.count} رأس`)
};

/**
* | output |
* | --- |
* | "Headers detected: {count}" |
*
* @param {Developerportal_Onboarding_Datamapping_Csvheadersdetected4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_csvheadersdetected4 = /** @type {((inputs: Developerportal_Onboarding_Datamapping_Csvheadersdetected4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Csvheadersdetected4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_csvheadersdetected4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_csvheadersdetected4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_csvheadersdetected4(inputs)
	return ar_developerportal_onboarding_datamapping_csvheadersdetected4(inputs)
});
export { developerportal_onboarding_datamapping_csvheadersdetected4 as "developerPortal.onboarding.dataMapping.csvHeadersDetected" }