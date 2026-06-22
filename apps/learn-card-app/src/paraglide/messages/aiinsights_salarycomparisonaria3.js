/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown>, salary: NonNullable<unknown>, low: NonNullable<unknown>, high: NonNullable<unknown>, avg: NonNullable<unknown>, percent: NonNullable<unknown>, titlePlural: NonNullable<unknown> }} Aiinsights_Salarycomparisonaria3Inputs */

const en_aiinsights_salarycomparisonaria3 = /** @type {(inputs: Aiinsights_Salarycomparisonaria3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Salary comparison for ${i?.title}. Your salary is ${i?.salary}. Market range is ${i?.low} to ${i?.high}, with an average of ${i?.avg}. You are above ${i?.percent}% of other ${i?.titlePlural} in the market.`)
};

const es_aiinsights_salarycomparisonaria3 = /** @type {(inputs: Aiinsights_Salarycomparisonaria3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Comparación salarial para ${i?.title}. Tu salario es ${i?.salary}. El rango del mercado es de ${i?.low} a ${i?.high}, con un promedio de ${i?.avg}. Estás por encima del ${i?.percent}% de otros ${i?.titlePlural} en el mercado.`)
};

const fr_aiinsights_salarycomparisonaria3 = /** @type {(inputs: Aiinsights_Salarycomparisonaria3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Comparaison salariale pour ${i?.title}. Votre salaire est ${i?.salary}. La fourchette du marché est de ${i?.low} à ${i?.high}, avec une moyenne de ${i?.avg}. Vous êtes au-dessus de ${i?.percent}% des autres ${i?.titlePlural} sur le marché.`)
};

const ar_aiinsights_salarycomparisonaria3 = /** @type {(inputs: Aiinsights_Salarycomparisonaria3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`مقارنة الرواتب لـ ${i?.title}. راتبك هو ${i?.salary}. نطاق السوق من ${i?.low} إلى ${i?.high}، بمتوسط ${i?.avg}. أنت أعلى من ${i?.percent}% من ${i?.titlePlural} الآخرين في السوق.`)
};

/**
* | output |
* | --- |
* | "Salary comparison for {title}. Your salary is {salary}. Market range is {low} to {high}, with an average of {avg}. You are above {percent}% of other {titlePl..." |
*
* @param {Aiinsights_Salarycomparisonaria3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_salarycomparisonaria3 = /** @type {((inputs: Aiinsights_Salarycomparisonaria3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Salarycomparisonaria3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_salarycomparisonaria3(inputs)
	if (locale === "es") return es_aiinsights_salarycomparisonaria3(inputs)
	if (locale === "fr") return fr_aiinsights_salarycomparisonaria3(inputs)
	return ar_aiinsights_salarycomparisonaria3(inputs)
});
export { aiinsights_salarycomparisonaria3 as "aiInsights.salaryComparisonAria" }