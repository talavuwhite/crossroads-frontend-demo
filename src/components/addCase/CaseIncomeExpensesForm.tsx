import React from "react";
import type { FormikProps } from "formik";
import { FieldArray, FormikProvider } from "formik";
import type { AddCaseFormValues, Expense, IncomeSource } from "@/types/case";

interface Props {
  formik: FormikProps<AddCaseFormValues>;
  arrayInputClass: (field: keyof AddCaseFormValues | string) => string;
  inputClass?: (field: keyof AddCaseFormValues | string) => string;
  errorMsg: (field: keyof AddCaseFormValues | string) => React.ReactNode;
}

const CaseIncomeExpensesForm: React.FC<Props> = ({
  formik,
  arrayInputClass,
  errorMsg,
}) => {
  const incomeInterval = [
    "Weekly",
    "Bi-Weekly",
    "Monthly",
    "Bi-Monthly",
    "Quarterly",
    "Bi-Yearly",
    "Yearly",
  ];
  const expenseInterval = [
    "Weekly",
    "Bi-Weekly",
    "Monthly",
    "Bi-Monthly",
    "Quarterly",
    "Bi-Yearly",
    "Yearly",
  ];
  return (
    <FormikProvider value={formik}>
      <div className="space-y-6">
        <FieldArray name="incomeSources">
          {({ push, remove }) => (
            <div>
              <label className="font-semibold">Income Sources</label>
              {formik.values.incomeSources.map(
                (inc: IncomeSource, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-wrap gap-2 items-start mt-2"
                  >
                    <div className="flex-1 min-w-[150px]">
                      <input
                        name={`incomeSources[${idx}].name`}
                        className={arrayInputClass(
                          `incomeSources[${idx}].name`
                        )}
                        placeholder="Name"
                        value={inc.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {errorMsg(`incomeSources[${idx}].name`)}
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <input
                        name={`incomeSources[${idx}].phone`}
                        className={arrayInputClass(
                          `incomeSources[${idx}].phone`
                        )}
                        placeholder="Phone"
                        value={inc.phone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {errorMsg(`incomeSources[${idx}].phone`)}
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <input
                        name={`incomeSources[${idx}].amount`}
                        className={arrayInputClass(
                          `incomeSources[${idx}].amount`
                        )}
                        placeholder="Amount"
                        value={inc.amount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {errorMsg(`incomeSources[${idx}].amount`)}
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <select
                        name={`incomeSources[${idx}].interval`}
                        className={arrayInputClass(
                          `incomeSources[${idx}].interval`
                        )}
                        value={inc.interval}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        <option value="">Interval</option>
                        {incomeInterval.map((opt, index) => (
                          <option id="index" key={index}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {errorMsg(`incomeSources[${idx}].interval`)}
                    </div>
                    {idx === 0 ? (
                      <button
                        type="button"
                        className="text-green-600 font-bold text-xl"
                        onClick={() =>
                          push({
                            name: "",
                            phone: "",
                            amount: "",
                            interval: "",
                          })
                        }
                      >
                        +
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-red-600 font-bold text-xl"
                        onClick={() => remove(idx)}
                      >
                        -
                      </button>
                    )}
                  </div>
                )
              )}
              {typeof formik.errors.incomeSources === "string" &&
                formik.touched.incomeSources && (
                  <div className="text-red-500 text-xs mt-1">
                    {formik.errors.incomeSources}
                  </div>
                )}
            </div>
          )}
        </FieldArray>
        <FieldArray name="expenses">
          {({ push, remove }) => (
            <div>
              <label className="font-semibold">Expenses</label>
              {formik.values.expenses.map((exp: Expense, idx: number) => (
                <div
                  key={idx}
                  className="flex flex-wrap gap-2 items-start mt-2"
                >
                  <div className="flex-1 min-w-[150px]">
                    <input
                      name={`expenses[${idx}].name`}
                      className={arrayInputClass(`expenses[${idx}].name`)}
                      placeholder="Name"
                      value={exp.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {errorMsg(`expenses[${idx}].name`)}
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <input
                      name={`expenses[${idx}].phone`}
                      className={arrayInputClass(`expenses[${idx}].phone`)}
                      placeholder="Phone"
                      value={exp.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {errorMsg(`expenses[${idx}].phone`)}
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <input
                      name={`expenses[${idx}].amount`}
                      className={arrayInputClass(`expenses[${idx}].amount`)}
                      placeholder="Amount"
                      value={exp.amount}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {errorMsg(`expenses[${idx}].amount`)}
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <select
                      name={`expenses[${idx}].interval`}
                      className={arrayInputClass(`expenses[${idx}].interval`)}
                      value={exp.interval}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">Interval</option>
                      {expenseInterval.map((opt, index) => (
                        <option id="index" key={index}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errorMsg(`expenses[${idx}].interval`)}
                  </div>
                  {idx === 0 ? (
                    <button
                      type="button"
                      className="text-green-600 font-bold text-xl"
                      onClick={() =>
                        push({
                          name: "",
                          phone: "",
                          amount: "",
                          interval: "",
                        })
                      }
                    >
                      +
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-red-600 font-bold text-xl"
                      onClick={() => remove(idx)}
                    >
                      -
                    </button>
                  )}
                </div>
              ))}
              {typeof formik.errors.expenses === "string" &&
                formik.touched.expenses && (
                  <div className="text-red-500 text-xs mt-1">
                    {formik.errors.expenses}
                  </div>
                )}
            </div>
          )}
        </FieldArray>
      </div>
    </FormikProvider>
  );
};

export default CaseIncomeExpensesForm;
