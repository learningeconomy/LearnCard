/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Createcontractstep_Redirectflowdescription6Inputs */

const en_developerportal_guides_consentflow_createcontractstep_redirectflowdescription6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Redirectflowdescription6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent Redirect Flow: Collect user consent and credentials from your external application. Users will be redirected to LearnCard to grant permissions, then back to your app with their credentials.`)
};

const es_developerportal_guides_consentflow_createcontractstep_redirectflowdescription6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Redirectflowdescription6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flujo de Redirección de Consentimiento: Recopila el consentimiento y las credenciales del usuario desde tu aplicación externa. Los usuarios serán redirigidos a LearnCard para otorgar permisos, y luego de vuelta a tu aplicación con sus credenciales.`)
};

const fr_developerportal_guides_consentflow_createcontractstep_redirectflowdescription6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Redirectflowdescription6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flux de Redirection de Consentement : recueillez le consentement et les certificats de l'utilisateur depuis votre application externe. Les utilisateurs seront redirigés vers LearnCard pour accorder les autorisations, puis de retour vers votre application avec leurs certificats.`)
};

const ar_developerportal_guides_consentflow_createcontractstep_redirectflowdescription6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Redirectflowdescription6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تدفق إعادة توجيه الموافقة: اجمع موافقة المستخدم والمؤهلات من تطبيقك الخارجي. ستتم إعادة توجيه المستخدمين إلى LearnCard لمنح الأذونات، ثم العودة إلى تطبيقك مع مؤهلاتهم.`)
};

/**
* | output |
* | --- |
* | "Consent Redirect Flow: Collect user consent and credentials from your external application. Users will be redirected to LearnCard to grant permissions, then ..." |
*
* @param {Developerportal_Guides_Consentflow_Createcontractstep_Redirectflowdescription6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_createcontractstep_redirectflowdescription6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Createcontractstep_Redirectflowdescription6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Createcontractstep_Redirectflowdescription6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_createcontractstep_redirectflowdescription6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_createcontractstep_redirectflowdescription6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_createcontractstep_redirectflowdescription6(inputs)
	return ar_developerportal_guides_consentflow_createcontractstep_redirectflowdescription6(inputs)
});
export { developerportal_guides_consentflow_createcontractstep_redirectflowdescription6 as "developerPortal.guides.consentFlow.createContractStep.redirectFlowDescription" }