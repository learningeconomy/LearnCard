/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Alreadyconsenteddesc3Inputs */

const en_consentflow_alreadyconsenteddesc3 = /** @type {(inputs: Consentflow_Alreadyconsenteddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You've already consented to this connection. Any new credentials will be synced to your account soon!`)
};

const es_consentflow_alreadyconsenteddesc3 = /** @type {(inputs: Consentflow_Alreadyconsenteddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ya has dado tu consentimiento para esta conexión. ¡Las nuevas credenciales se sincronizarán pronto!`)
};

const fr_consentflow_alreadyconsenteddesc3 = /** @type {(inputs: Consentflow_Alreadyconsenteddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez déjà consenti à cette connexion. Les nouveaux justificatifs seront bientôt synchronisés avec votre compte !`)
};

const ar_consentflow_alreadyconsenteddesc3 = /** @type {(inputs: Consentflow_Alreadyconsenteddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد وافقت بالفعل على هذا الاتصال. أي مؤهلات جديدة ستتم مزامنتها مع حسابك قريباً!`)
};

/**
* | output |
* | --- |
* | "You've already consented to this connection. Any new credentials will be synced to your account soon!" |
*
* @param {Consentflow_Alreadyconsenteddesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_alreadyconsenteddesc3 = /** @type {((inputs?: Consentflow_Alreadyconsenteddesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Alreadyconsenteddesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_alreadyconsenteddesc3(inputs)
	if (locale === "es") return es_consentflow_alreadyconsenteddesc3(inputs)
	if (locale === "fr") return fr_consentflow_alreadyconsenteddesc3(inputs)
	return ar_consentflow_alreadyconsenteddesc3(inputs)
});
export { consentflow_alreadyconsenteddesc3 as "consentFlow.alreadyConsentedDesc" }