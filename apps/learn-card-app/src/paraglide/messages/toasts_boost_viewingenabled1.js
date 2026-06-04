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

const de_toasts_boost_viewingenabled1 = /** @type {(inputs: Toasts_Boost_Viewingenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ansicht aktiviert. Du kannst jetzt Beanspruchungslinks generieren.`)
};

const ar_toasts_boost_viewingenabled1 = /** @type {(inputs: Toasts_Boost_Viewingenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تمكين العرض. يمكنك الآن إنشاء روابط المطالبة.`)
};

const fr_toasts_boost_viewingenabled1 = /** @type {(inputs: Toasts_Boost_Viewingenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consultation activée. Vous pouvez maintenant générer des liens de réclamation.`)
};

const ko_toasts_boost_viewingenabled1 = /** @type {(inputs: Toasts_Boost_Viewingenabled1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보기가 활성화되었습니다. 이제 수령 링크를 생성할 수 있습니다.`)
};

/**
* | output |
* | --- |
* | "Viewing enabled. You can now generate claim links." |
*
* @param {Toasts_Boost_Viewingenabled1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_boost_viewingenabled1 = /** @type {((inputs?: Toasts_Boost_Viewingenabled1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Viewingenabled1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_viewingenabled1(inputs)
	if (locale === "es") return es_toasts_boost_viewingenabled1(inputs)
	if (locale === "de") return de_toasts_boost_viewingenabled1(inputs)
	if (locale === "ar") return ar_toasts_boost_viewingenabled1(inputs)
	if (locale === "fr") return fr_toasts_boost_viewingenabled1(inputs)
	return ko_toasts_boost_viewingenabled1(inputs)
});
export { toasts_boost_viewingenabled1 as "toasts.boost.viewingEnabled" }