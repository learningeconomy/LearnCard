/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Intro3Inputs */

const en_developerportal_integrationguide_directlink_intro3 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Intro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Direct Link is the simplest integration — users click your app and are redirected to your URL with optional query parameters for user context.`)
};

const es_developerportal_integrationguide_directlink_intro3 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Intro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El Enlace Directo es la integración más simple — los usuarios hacen clic en tu aplicación y son redirigidos a tu URL con parámetros de consulta opcionales para el contexto del usuario.`)
};

const fr_developerportal_integrationguide_directlink_intro3 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Intro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le Lien Direct est l'intégration la plus simple — les utilisateurs cliquent sur votre application et sont redirigés vers votre URL avec des paramètres de requête optionnels pour le contexte utilisateur.`)
};

const ar_developerportal_integrationguide_directlink_intro3 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Intro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرابط المباشر هو أبسط تكامل — ينقر المستخدمون على تطبيقك ويتم إعادة توجيههم إلى عنوان URL الخاص بك مع معلمات استعلام اختيارية لسياق المستخدم.`)
};

/**
* | output |
* | --- |
* | "Direct Link is the simplest integration — users click your app and are redirected to your URL with optional query parameters for user context." |
*
* @param {Developerportal_Integrationguide_Directlink_Intro3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_intro3 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Intro3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Intro3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_intro3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_intro3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_intro3(inputs)
	return ar_developerportal_integrationguide_directlink_intro3(inputs)
});
export { developerportal_integrationguide_directlink_intro3 as "developerPortal.integrationGuide.directLink.intro" }