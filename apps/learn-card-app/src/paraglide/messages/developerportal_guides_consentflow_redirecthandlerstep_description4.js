/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Description4Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When users click "Connect with LearnCard" in your app, they'll be redirected to LearnCard to grant consent, then back to your app with their DID and credentials.`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuando los usuarios hagan clic en "Conectar con LearnCard" en tu aplicación, serán redirigidos a LearnCard para otorgar consentimiento, y luego de vuelta a tu aplicación con su DID y credenciales.`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lorsque les utilisateurs cliquent sur « Se connecter avec LearnCard » dans votre application, ils seront redirigés vers LearnCard pour accorder leur consentement, puis de retour vers votre application avec leur DID et leurs certificats.`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عندما ينقر المستخدمون على «الاتصال بـ LearnCard» في تطبيقك، ستتم إعادة توجيههم إلى LearnCard لمنح الموافقة، ثم العودة إلى تطبيقك مع DID ومؤهلاتهم.`)
};

/**
* | output |
* | --- |
* | "When users click \"Connect with LearnCard\" in your app, they'll be redirected to LearnCard to grant consent, then back to your app with their DID and credenti..." |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_description4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_description4(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_description4(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_description4 as "developerPortal.guides.consentFlow.redirectHandlerStep.description" }