/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Advancedserverinfo5Inputs */

const en_developerportal_guides_embedapp_templatemanager_advancedserverinfo5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Advancedserverinfo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use this server-side function to dynamically retrieve all boost templates for your app listing. This is useful for building template pickers or syncing templates to your database.`)
};

const es_developerportal_guides_embedapp_templatemanager_advancedserverinfo5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Advancedserverinfo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use this server-side function to dynamically retrieve all boost templates for your app listing. This is useful for building template pickers or syncing templates to your database.`)
};

const fr_developerportal_guides_embedapp_templatemanager_advancedserverinfo5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Advancedserverinfo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use this server-side function to dynamically retrieve all boost templates for your app listing. This is useful for building template pickers or syncing templates to your database.`)
};

const ar_developerportal_guides_embedapp_templatemanager_advancedserverinfo5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Advancedserverinfo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use this server-side function to dynamically retrieve all boost templates for your app listing. This is useful for building template pickers or syncing templates to your database.`)
};

/**
* | output |
* | --- |
* | "Use this server-side function to dynamically retrieve all boost templates for your app listing. This is useful for building template pickers or syncing templ..." |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Advancedserverinfo5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_advancedserverinfo5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Advancedserverinfo5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Advancedserverinfo5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_advancedserverinfo5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_advancedserverinfo5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_advancedserverinfo5(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_advancedserverinfo5(inputs)
});
export { developerportal_guides_embedapp_templatemanager_advancedserverinfo5 as "developerPortal.guides.embedApp.templateManager.advancedServerInfo" }