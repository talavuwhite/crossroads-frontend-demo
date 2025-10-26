import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import * as Yup from "yup";
import { useFormik } from "formik";
import type { PrintOutcomesFormValues } from "@/types/case";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { errorMsg } from "@/utils/formikHelpers";

interface PrintOutcomesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrintOutcomesModal = ({ isOpen, onClose }: PrintOutcomesModalProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openGoals, setOpenGoals] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  // const [selectedGoals, setSelectedGoals] = useState([]);
  const [includeComments, setIncludeComments] = useState(false);

  const initialValues = {
    title: "",
    description: "",
    selectedGoals: [],
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
    description: Yup.string(),
    selectedGoals: Yup.array().of(Yup.string()),
  });

  const formik = useFormik<PrintOutcomesFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    // @ts-ignore
    onSubmit: (values) => {
      navigate(`${location.pathname}/print`);
    },
  });

  const toggleSections = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      title={STATIC_TEXTS.OUTCOMES.PRINT_OUTCOME_WORKSHEET}
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-between gap-3">
          <Button
            label={STATIC_TEXTS.OUTCOMES.PRINT_WORKSHEET}
            icon="mdi:printer"
            onClick={() => formik.handleSubmit()}
            variant="submitStyle"
          />

          <Button
            label="Cancel"
            icon="mdi:close"
            className="hover:bg-red-600 hover:text-white"
            onClick={onClose}
            variant="default"
          />
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grow">
          <label className="font-semibold">
            {LABELS.FORM.WORKSHEET_TITLE}
            <span className="text-red-600"> *</span>
          </label>
          <input
            type="text"
            {...formik.getFieldProps("title")}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none"
          />
          {errorMsg("title", formik)}
        </div>
        <div className="grow">
          <label className="font-semibold">{LABELS.FORM.DESCRIPTION2}</label>
          <textarea
            rows={4}
            {...formik.getFieldProps("description")}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none"
          />
        </div>

        <div>
          <div
            role="button"
            onClick={() => setOpenGoals((prev) => !prev)}
            className={`${
              openGoals ? "rounded-lg rounded-b-none" : "rounded-lg"
            } bg-purple/10 border border-gray-300 text-sm flex items-center justify-between p-2 cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <Icon
                icon="mdi:check-bold"
                width="18"
                height="18"
                className="text-green-600"
              />
              <div className="select-none">
                {STATIC_TEXTS.OUTCOMES.SELECT_GOALS_TO_INCLUDE}
              </div>
            </div>
            <div className="border flex items-center justify-center">
              <Icon icon="mdi:plus" width="14" height="14" />
            </div>
          </div>
          {openGoals && (
            <div className="flex flex-col gap-2 p-2 bg-purple/10 rounded-b-lg">
              <div>
                <div
                  role="button"
                  onClick={() => toggleSections("Education")}
                  className="border border-gray-300 bg-white cursor-pointer px-2 py-1 flex items-center gap-2 justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:folder-open"
                      width="18"
                      height="18"
                      className="text-yellow-600"
                    />
                    <div className="select-none text-sm">Education</div>
                  </div>
                  <div className="border flex items-center justify-center">
                    <Icon icon="mdi:plus" width="14" height="14" />
                  </div>
                </div>
                {openSections.includes("Education") && (
                  <div className="flex flex-col p-2 bg-white">
                    {[
                      "Apply for Job Skills Training",
                      "English as a Second Language",
                    ].map((label) => {
                      const isChecked =
                        formik.values.selectedGoals.includes(label);

                      const handleToggle = () => {
                        const current = formik.values.selectedGoals;
                        const newValue = isChecked
                          ? current.filter((item) => item !== label) // remove
                          : [...current, label]; // add
                        formik.setFieldValue("selectedGoals", newValue);
                      };
                      return (
                        <div>
                          <label className=" flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-3 h-3 rounded border-gray-300 text-purple focus:ring-purple/20 outline-none focus:outline-none !accent-purple"
                              checked={isChecked}
                              onChange={handleToggle}
                            />
                            <span className="text-xs select-none">{label}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className=" flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-purple focus:ring-purple/20 outline-none focus:outline-none !accent-purple"
              checked={includeComments}
              onChange={() => setIncludeComments((prev) => !prev)}
            />
            <label className="select-none font-semibold">
              {STATIC_TEXTS.OUTCOMES.INCLUDE_COMMENTS}
            </label>
          </label>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default PrintOutcomesModal;
