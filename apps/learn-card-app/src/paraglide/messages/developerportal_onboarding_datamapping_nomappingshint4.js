/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Nomappingshint4Inputs */

const en_developerportal_onboarding_datamapping_nomappingshint4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Nomappingshint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Click a source field and target field to create a mapping.`)
};

const es_developerportal_onboarding_datamapping_nomappingshint4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Nomappingshint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Haz clic en un campo de origen y un campo de destino para crear un mapeo.`)
};

const fr_developerportal_onboarding_datamapping_nomappingshint4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Nomappingshint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cliquez sur un champ source et un champ cible pour créer un mapping.`)
};

const ar_developerportal_onboarding_datamapping_nomappingshint4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Nomappingshint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انقر على حقل مصدر وحقل هدف لإنشاء تخطيط.`)
};

/**
* | output |
* | --- |
* | "Click a source field and target field to create a mapping." |
*
* @param {Developerportal_Onboarding_Datamapping_Nomappingshint4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_nomappingshint4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Nomappingshint4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Nomappingshint4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_nomappingshint4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_nomappingshint4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_nomappingshint4(inputs)
	return ar_developerportal_onboarding_datamapping_nomappingshint4(inputs)
});
export { developerportal_onboarding_datamapping_nomappingshint4 as "developerPortal.onboarding.dataMapping.noMappingsHint" }