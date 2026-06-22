/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Readydesc2Inputs */

const en_developerportal_onboarding_production_readydesc2 = /** @type {(inputs: Developerportal_Onboarding_Production_Readydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your integration setup is complete. When you activate production mode, your system will be able to issue real verifiable credentials to users.`)
};

const es_developerportal_onboarding_production_readydesc2 = /** @type {(inputs: Developerportal_Onboarding_Production_Readydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La configuración de tu integración está completa. Cuando actives el modo de producción, tu sistema podrá emitir credenciales verificables reales a los usuarios.`)
};

const fr_developerportal_onboarding_production_readydesc2 = /** @type {(inputs: Developerportal_Onboarding_Production_Readydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La configuration de votre intégration est terminée. Lorsque vous activez le mode production, votre système pourra émettre de vrais credentials vérifiables aux utilisateurs.`)
};

const ar_developerportal_onboarding_production_readydesc2 = /** @type {(inputs: Developerportal_Onboarding_Production_Readydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتمل إعداد التكامل الخاص بك. عند تنشيط وضع الإنتاج، سيكون نظامك قادراً على إصدار بيانات اعتماد قابلة للتحقق حقيقية للمستخدمين.`)
};

/**
* | output |
* | --- |
* | "Your integration setup is complete. When you activate production mode, your system will be able to issue real verifiable credentials to users." |
*
* @param {Developerportal_Onboarding_Production_Readydesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_readydesc2 = /** @type {((inputs?: Developerportal_Onboarding_Production_Readydesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Readydesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_readydesc2(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_readydesc2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_readydesc2(inputs)
	return ar_developerportal_onboarding_production_readydesc2(inputs)
});
export { developerportal_onboarding_production_readydesc2 as "developerPortal.onboarding.production.readyDesc" }