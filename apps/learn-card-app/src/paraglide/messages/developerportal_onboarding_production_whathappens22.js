/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Whathappens22Inputs */

const en_developerportal_onboarding_production_whathappens22 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API calls will issue real credentials that recipients can store in their wallets`)
};

const es_developerportal_onboarding_production_whathappens22 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las llamadas API emitirán credenciales reales que los destinatarios pueden almacenar en sus billeteras`)
};

const fr_developerportal_onboarding_production_whathappens22 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les appels API émettront de vrais credentials que les destinataires pourront stocker dans leurs portefeuilles`)
};

const ar_developerportal_onboarding_production_whathappens22 = /** @type {(inputs: Developerportal_Onboarding_Production_Whathappens22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستصدر استدعاءات API بيانات اعتماد حقيقية يمكن للمستلمين تخزينها في محافظهم`)
};

/**
* | output |
* | --- |
* | "API calls will issue real credentials that recipients can store in their wallets" |
*
* @param {Developerportal_Onboarding_Production_Whathappens22Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_whathappens22 = /** @type {((inputs?: Developerportal_Onboarding_Production_Whathappens22Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Whathappens22Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_whathappens22(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_whathappens22(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_whathappens22(inputs)
	return ar_developerportal_onboarding_production_whathappens22(inputs)
});
export { developerportal_onboarding_production_whathappens22 as "developerPortal.onboarding.production.whatHappens2" }