/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Whyusethisapp3Inputs */

const en_launchpad_detail_whyusethisapp3 = /** @type {(inputs: Launchpad_Detail_Whyusethisapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Why Use This App?`)
};

const es_launchpad_detail_whyusethisapp3 = /** @type {(inputs: Launchpad_Detail_Whyusethisapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Por qué usar esta app?`)
};

const de_launchpad_detail_whyusethisapp3 = /** @type {(inputs: Launchpad_Detail_Whyusethisapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Warum diese App nutzen?`)
};

const ar_launchpad_detail_whyusethisapp3 = /** @type {(inputs: Launchpad_Detail_Whyusethisapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لماذا استخدام هذا التطبيق؟`)
};

const fr_launchpad_detail_whyusethisapp3 = /** @type {(inputs: Launchpad_Detail_Whyusethisapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pourquoi utiliser cette application ?`)
};

const ko_launchpad_detail_whyusethisapp3 = /** @type {(inputs: Launchpad_Detail_Whyusethisapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 앱을 사용하는 이유`)
};

/**
* | output |
* | --- |
* | "Why Use This App?" |
*
* @param {Launchpad_Detail_Whyusethisapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_whyusethisapp3 = /** @type {((inputs?: Launchpad_Detail_Whyusethisapp3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Whyusethisapp3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_whyusethisapp3(inputs)
	if (locale === "es") return es_launchpad_detail_whyusethisapp3(inputs)
	if (locale === "de") return de_launchpad_detail_whyusethisapp3(inputs)
	if (locale === "ar") return ar_launchpad_detail_whyusethisapp3(inputs)
	if (locale === "fr") return fr_launchpad_detail_whyusethisapp3(inputs)
	return ko_launchpad_detail_whyusethisapp3(inputs)
});
export { launchpad_detail_whyusethisapp3 as "launchpad.detail.whyUseThisApp" }