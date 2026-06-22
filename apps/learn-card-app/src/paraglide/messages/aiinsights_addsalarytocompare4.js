/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Addsalarytocompare4Inputs */

const en_aiinsights_addsalarytocompare4 = /** @type {(inputs: Aiinsights_Addsalarytocompare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add your salary to see how you compare against the market.`)
};

const es_aiinsights_addsalarytocompare4 = /** @type {(inputs: Aiinsights_Addsalarytocompare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agrega tu salario para ver cómo te comparas con el mercado.`)
};

const fr_aiinsights_addsalarytocompare4 = /** @type {(inputs: Aiinsights_Addsalarytocompare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez votre salaire pour voir comment vous vous comparez au marché.`)
};

const ar_aiinsights_addsalarytocompare4 = /** @type {(inputs: Aiinsights_Addsalarytocompare4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف راتبك لمعرفة كيف تقارن نفسك بالسوق.`)
};

/**
* | output |
* | --- |
* | "Add your salary to see how you compare against the market." |
*
* @param {Aiinsights_Addsalarytocompare4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_addsalarytocompare4 = /** @type {((inputs?: Aiinsights_Addsalarytocompare4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Addsalarytocompare4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_addsalarytocompare4(inputs)
	if (locale === "es") return es_aiinsights_addsalarytocompare4(inputs)
	if (locale === "fr") return fr_aiinsights_addsalarytocompare4(inputs)
	return ar_aiinsights_addsalarytocompare4(inputs)
});
export { aiinsights_addsalarytocompare4 as "aiInsights.addSalaryToCompare" }