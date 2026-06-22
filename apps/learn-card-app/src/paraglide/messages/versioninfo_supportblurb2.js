/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Supportblurb2Inputs */

const en_versioninfo_supportblurb2 = /** @type {(inputs: Versioninfo_Supportblurb2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`These details help support identify exactly which build you’re running if you ever need to report an issue.`)
};

const es_versioninfo_supportblurb2 = /** @type {(inputs: Versioninfo_Supportblurb2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estos detalles ayudan al soporte a identificar exactamente qué compilación estás usando si alguna vez necesitas reportar un problema.`)
};

const fr_versioninfo_supportblurb2 = /** @type {(inputs: Versioninfo_Supportblurb2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ces détails aident le support à identifier précisément la version que vous utilisez si vous avez besoin de signaler un problème.`)
};

const ar_versioninfo_supportblurb2 = /** @type {(inputs: Versioninfo_Supportblurb2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تساعد هذه التفاصيل فريق الدعم على تحديد الإصدار الذي تستخدمه بدقة إذا احتجت إلى الإبلاغ عن مشكلة.`)
};

/**
* | output |
* | --- |
* | "These details help support identify exactly which build you’re running if you ever need to report an issue." |
*
* @param {Versioninfo_Supportblurb2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_supportblurb2 = /** @type {((inputs?: Versioninfo_Supportblurb2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Supportblurb2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_supportblurb2(inputs)
	if (locale === "es") return es_versioninfo_supportblurb2(inputs)
	if (locale === "fr") return fr_versioninfo_supportblurb2(inputs)
	return ar_versioninfo_supportblurb2(inputs)
});
export { versioninfo_supportblurb2 as "versionInfo.supportBlurb" }