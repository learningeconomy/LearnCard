/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Step1desc4Inputs */

const en_developerportal_integrationguide_directlink_step1desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Provide the URL where users will be redirected when they launch your app.`)
};

const es_developerportal_integrationguide_directlink_step1desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Proporciona la URL a la que los usuarios serán redirigidos cuando inicien tu aplicación.`)
};

const fr_developerportal_integrationguide_directlink_step1desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fournissez l'URL vers laquelle les utilisateurs seront redirigés lorsqu'ils lanceront votre application.`)
};

const ar_developerportal_integrationguide_directlink_step1desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قدم عنوان URL الذي سيعاد توجيه المستخدمين إليه عند تشغيل تطبيقك.`)
};

/**
* | output |
* | --- |
* | "Provide the URL where users will be redirected when they launch your app." |
*
* @param {Developerportal_Integrationguide_Directlink_Step1desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_step1desc4 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Step1desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Step1desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_step1desc4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_step1desc4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_step1desc4(inputs)
	return ar_developerportal_integrationguide_directlink_step1desc4(inputs)
});
export { developerportal_integrationguide_directlink_step1desc4 as "developerPortal.integrationGuide.directLink.step1Desc" }