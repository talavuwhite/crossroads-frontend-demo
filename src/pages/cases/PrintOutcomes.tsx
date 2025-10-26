import Button from "@/components/ui/Button";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useEffect } from "react";

const PrintOutcomes = () => {
  useEffect(() => {
    const header = document.getElementById("no-print-header");
    const toggleButton = document.getElementById("no-print-toggle");
    const subHeader = document.getElementById("no-print-subheader");
    const sidebar = document.getElementById("no-print-sidebar");
    const caseSidebar = document.getElementById("no-print-case-sidebar");

    header?.classList.add("print:hidden");
    subHeader?.classList.add("print:hidden");
    sidebar?.classList.add("print:hidden");
    toggleButton?.classList.add("print:hidden");
    caseSidebar?.classList.add("print:hidden");

    return () => {
      header?.classList.remove("print:hidden");
      subHeader?.classList.remove("print:hidden");
      sidebar?.classList.remove("print:hidden");
      toggleButton?.classList.remove("print:hidden");
      caseSidebar?.classList.remove("print:hidden");
    };
  }, []);

  return (
    <div>
      <div className="bd-purple/10 p-2 flex items-center justify-between print:hidden">
        <Button
          label="Go Back"
          onClick={() => {
            window.history.back();
          }}
          variant="default"
          icon="mdi:arrow-back"
        />
        <div className="text-lg">Demo</div>
        <Button
          label="Print"
          onClick={() => {
            window.print();
          }}
          variant="submitStyle"
          icon="mdi:printer"
        />
      </div>
      <div className="px-4 py-1 text-gray-800">
        <h1 className="text-xl text-[#990000] my-2">
          Demo — New case casw from agency agent
        </h1>
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex items-center justify-between gap-3 mb-[10px]">
              <h1 className="text-4xl font-bold">Education</h1>
              <p className="text-xl font-bold">(16%)</p>
            </div>
            <ul className="border-t border-dotted border-gray-300">
              <li className="flex items-center justify-between gap-3 text-lg pl-[38px] pr-[15px] py-3 border-b border-dotted border-gray-300">
                <div className="flex items-center gap-3">
                  {true ? (
                    <Icon
                      icon="mdi:checkbox-outline"
                      width={20}
                      height={20}
                      className="text-gray-300"
                    />
                  ) : (
                    <Icon icon="mdi:checkbox-blank-outline" width={20} height={20} />
                  )}
                  <span className={`${true ? "line-through text-gray-300" : ""}`}>
                    Apply for Job Skills Training
                  </span>
                </div>
                <div className="text-red-600">Dec 4, 2025</div>
              </li>
              <li className="flex items-center justify-between gap-3 text-lg pl-[38px] pr-[15px] py-3 border-b border-dotted border-gray-300">
                <div className="flex items-center gap-3">
                  {false ? (
                    <Icon
                      icon="mdi:checkbox-outline"
                      width={20}
                      height={20}
                      className="text-gray-300"
                    />
                  ) : (
                    <Icon icon="mdi:checkbox-blank-outline" width={20} height={20} />
                  )}
                  <span className={`${false ? "line-through text-gray-300" : ""}`}>
                    English as a Second Language
                  </span>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-[10px]">
              <h1 className="text-4xl font-bold">Comments</h1>
            </div>
            <div className="flex flex-col text-gray-800 text-lg border-t border-dotted border-gray-300">
              <div className="pl-[38px] pr-[15px] py-3 border border-t-0 border-dotted border-gray-300">
                <span className="underline">Dhruven GHL - Jul 9, 2025</span> :
                Comment 1
              </div>
              <div className="pl-[38px] pr-[15px] py-3 border border-t-0 border-dotted border-gray-300">
                <span className="underline">Dhruven GHL - Jul 9, 2025</span> :
                Comment 2
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintOutcomes;
