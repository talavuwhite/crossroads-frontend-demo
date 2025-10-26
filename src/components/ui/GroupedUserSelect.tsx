/**
 * GroupedUserSelect - Reusable grouped user dropdown
 *
 * Usage:
 * 1. With Formik (returns userId):
 *    <GroupedUserSelect name="userId" users={userList} />
 *
 * 2. Controlled (returns user object):
 *    <GroupedUserSelect value={selectedUser} onChange={setSelectedUser} users={userList} />
 *
 * Props:
 * - users: UserData[] (required)
 * - name: string (Formik only)
 * - value: UserData | string | undefined (controlled only)
 * - onChange: (user: UserData | null) => void (controlled only)
 * - showMyself, showNone, disabled, className, ...rest
 */
import React from "react";
import { Field } from "formik";
import type { UserData } from "@/types/user";

interface GroupedUserSelectProps {
    name?: string;
    users: UserData[];
    value?: string | undefined;
    onChange?: (user: UserData | null) => void;
    disabled?: boolean;
    className?: string;
    showMyself?: boolean;
    showNone?: boolean;
    [key: string]: unknown; // for extra props
}

const groupUsers = (users: UserData[]) =>
    users.reduce<Record<string, UserData[]>>((acc, user) => {
        const company: string =
            user.company?.companyName ||
            user.company?.locationName ||
            "Unknown Company";
        if (!acc[company]) acc[company] = [];
        acc[company].push(user);
        return acc;
    }, {});

const GroupedUserSelect: React.FC<GroupedUserSelectProps> = ({
    name,
    users,
    value,
    onChange,
    disabled,
    className = "",
    showMyself = true,
    showNone = true,
    ...props
}) => {
    // Controlled (non-Formik) mode
    if (onChange) {
        return (
            <select
                value={value ?? ""}
                onChange={e => {
                    const selectedId = e.target.value;
                    if (!selectedId) return onChange(null);
                    if (selectedId === "myself") return onChange({ _id: "myself" } as UserData);
                    const user = users.find(u => u._id === selectedId) || null;
                    onChange(user);
                }}
                disabled={disabled}
                className={className}
                {...props}
            >
                {showNone && <option value="">None</option>}
                {showMyself && <option value="myself">Myself</option>}
                {Object.entries(groupUsers(users)).map(([company, users]) => (
                    <optgroup key={company} label={company} className="text-purple">
                        {users.map((user) => (
                            <option key={user.userId} value={user.userId} className="text-black">
                                {user.firstName} {user.lastName}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        );
    }
    // Formik mode
    return (
        <Field as="select" name={name} disabled={disabled} className={className} {...props}>
            {showNone && <option value="">None</option>}
            {showMyself && <option value="myself">Myself</option>}
            {Object.entries(groupUsers(users)).map(([company, users]) => (
                <optgroup key={company} label={company} className="text-purple">
                    {users.map((user) => (
                        <option key={user.userId} value={user.userId} className="text-black">
                            {user.firstName} {user.lastName}
                        </option>
                    ))}
                </optgroup>
            ))}
        </Field>
    );
};

export default GroupedUserSelect; 