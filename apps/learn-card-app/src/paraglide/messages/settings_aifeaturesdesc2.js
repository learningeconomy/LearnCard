/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Aifeaturesdesc2Inputs */

const en_settings_aifeaturesdesc2 = /** @type {(inputs: Settings_Aifeaturesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI tutoring sessions, insights, and personalization. This may share relevant messages and records with AI providers.`)
};

const es_settings_aifeaturesdesc2 = /** @type {(inputs: Settings_Aifeaturesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesiones de tutoría con IA, insights y personalización. Esto puede compartir mensajes y registros relevantes con proveedores de IA.`)
};

const fr_settings_aifeaturesdesc2 = /** @type {(inputs: Settings_Aifeaturesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sessions de tutorat par IA, insights et personnalisation. Cela peut partager des messages et des enregistrements pertinents avec des fournisseurs d'IA.`)
};

const ar_settings_aifeaturesdesc2 = /** @type {(inputs: Settings_Aifeaturesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسات تعليمية بالذكاء الاصطناعي ورؤى وتخصيص. قد يؤدي ذلك إلى مشاركة الرسائل والسجلات ذات الصلة مع مزوّدي الذكاء الاصطناعي.`)
};

/**
* | output |
* | --- |
* | "AI tutoring sessions, insights, and personalization. This may share relevant messages and records with AI providers." |
*
* @param {Settings_Aifeaturesdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_aifeaturesdesc2 = /** @type {((inputs?: Settings_Aifeaturesdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Aifeaturesdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_aifeaturesdesc2(inputs)
	if (locale === "es") return es_settings_aifeaturesdesc2(inputs)
	if (locale === "fr") return fr_settings_aifeaturesdesc2(inputs)
	return ar_settings_aifeaturesdesc2(inputs)
});
export { settings_aifeaturesdesc2 as "settings.aiFeaturesDesc" }