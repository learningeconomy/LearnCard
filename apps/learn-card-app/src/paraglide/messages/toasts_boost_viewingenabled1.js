/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Viewingenabled1Inputs */

const en_toasts_boost_viewingenabled1 = /** @type {(inputs: Toasts_Boost_Viewingenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Viewing enabled. You can now generate claim links.`)
};

const es_toasts_boost_viewingenabled1 = /** @type {(inputs: Toasts_Boost_Viewingenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visualización habilitada. Ahora puedes generar enlaces de reclamación.`)
};

const fr_toasts_boost_viewingenabled1 = /** @type {(inputs: Toasts_Boost_Viewingenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consultation activée. Vous pouvez maintenant générer des liens de réclamation.`)
};

const ar_toasts_boost_viewingenabled1 = /** @type {(inputs: Toasts_Boost_Viewingenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تمكين العرض. يمكنك الآن إنشاء روابط المطالبة.`)
};

/**
* | output |
* | --- |
* | "Viewing enabled. You can now generate claim links." |
*
* @param {Toasts_Boost_Viewingenabled1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_boost_viewingenabled1 = /** @type {((inputs?: Toasts_Boost_Viewingenabled1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Viewingenabled1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_viewingenabled1(inputs)
	if (locale === "es") return es_toasts_boost_viewingenabled1(inputs)
	if (locale === "fr") return fr_toasts_boost_viewingenabled1(inputs)
	return ar_toasts_boost_viewingenabled1(inputs)
});
export { toasts_boost_viewingenabled1 as "toasts.boost.viewingEnabled" }