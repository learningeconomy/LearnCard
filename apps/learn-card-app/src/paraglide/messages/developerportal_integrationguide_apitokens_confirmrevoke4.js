/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Integrationguide_Apitokens_Confirmrevoke4Inputs */

const en_developerportal_integrationguide_apitokens_confirmrevoke4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Confirmrevoke4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Are you sure you want to revoke "${i?.name}"?`)
};

const es_developerportal_integrationguide_apitokens_confirmrevoke4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Confirmrevoke4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que deseas revocar "${i?.name}"?`)
};

const fr_developerportal_integrationguide_apitokens_confirmrevoke4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Confirmrevoke4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir révoquer "${i?.name}" ?`)
};

const ar_developerportal_integrationguide_apitokens_confirmrevoke4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Confirmrevoke4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد من رغبتك في إلغاء "${i?.name}"؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to revoke \"{name}\"?" |
*
* @param {Developerportal_Integrationguide_Apitokens_Confirmrevoke4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_confirmrevoke4 = /** @type {((inputs: Developerportal_Integrationguide_Apitokens_Confirmrevoke4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Confirmrevoke4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_confirmrevoke4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_confirmrevoke4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_confirmrevoke4(inputs)
	return ar_developerportal_integrationguide_apitokens_confirmrevoke4(inputs)
});
export { developerportal_integrationguide_apitokens_confirmrevoke4 as "developerPortal.integrationGuide.apiTokens.confirmRevoke" }