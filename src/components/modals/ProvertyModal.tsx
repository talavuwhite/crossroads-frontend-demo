import { useFormik } from "formik";
import * as Yup from "yup";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";

const PovertyGuidelinesModal = ({
  isOpen,
  onClose,
  onSave,
  initialValues = { povertyLevel: 15060, adjustment: 5380 },
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: { povertyLevel: number; adjustment: number }) => void;
  initialValues?: { povertyLevel: number; adjustment: number };
}) => {
  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object({
      povertyLevel: Yup.number()
        .typeError("Enter a valid number")
        .min(0, "Must be greater than or equal to 0")
        .required("Poverty level is required"),
      adjustment: Yup.number()
        .typeError("Enter a valid number")
        .min(0, "Must be greater than or equal to 0")
        .required("Adjustment amount is required"),
    }),
    onSubmit: (values) => {
      onSave(values);
      onClose();
    },
    enableReinitialize: true,
  });

  const { povertyLevel, adjustment } = formik.values;

  const povertyLevels = Array.from(
    { length: 6 },
    (_, i) => povertyLevel + adjustment * i
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Poverty Guidelines"
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            label="Save Changes"
            variant="submitStyle"
            onClick={() => formik.handleSubmit()}
          />
          <Button label="Cancel" variant="dangerStyle" onClick={onClose} />
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <FormInput
          label="Poverty Level (1 Person)"
          name="povertyLevel"
          type="number"
          formik={formik}
          required
        />
        <FormInput
          label="Poverty Level Adjustment (Each Addl. Person)"
          name="adjustment"
          type="number"
          formik={formik}
          required
        />
        <div className="border-t border-gray-200 pt-4">
          <table className="w-full text-left text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-purple/10">
              <tr>
                <th className="px-3 py-2 font-medium text-gray-700">
                  Household Size
                </th>
                <th className="px-3 py-2 font-medium text-gray-700">
                  Poverty Level (100%)
                </th>
              </tr>
            </thead>
            <tbody>
              {povertyLevels.map((level, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-purple/5"}
                >
                  <td className="px-3 py-2">{index + 1}</td>
                  <td className="px-3 py-2">${level.toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td
                  colSpan={2}
                  className="px-3 py-2 text-sm text-gray-600 italic border-t border-gray-200"
                >
                  Additional members: Add ${adjustment.toLocaleString()} each
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default PovertyGuidelinesModal;
