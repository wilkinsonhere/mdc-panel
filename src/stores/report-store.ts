import { useSearchParams } from "next/navigation";


export function useReportType(): 'basic' | 'advanced' {
    const searchParams = useSearchParams();
    const reportType = searchParams.get('type') || 'basic'
    if (!(reportType === 'basic' || reportType === 'advanced'))
        throw TypeError("Invalid report type parameter");
    return reportType;
    
}