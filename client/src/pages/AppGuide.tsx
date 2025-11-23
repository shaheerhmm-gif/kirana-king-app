import OwnerLayout from '../components/OwnerLayout';
import { FileText, Users, BarChart2, Zap, Package } from 'lucide-react';

const AppGuide = () => {
    const features = [
        {
            icon: <Zap size={32} className="text-yellow-500" />,
            title: "Quick Sale (Jhatpat Bikri)",
            desc: "Sell items in 5 seconds. Just search, tap, and sell. Stock reduces automatically."
        },
        {
            icon: <Package size={32} className="text-blue-500" />,
            title: "Inventory (Samaan List)",
            desc: "See exactly what is in your shop. The app tells you when stock is low."
        },
        {
            icon: <Users size={32} className="text-purple-500" />,
            title: "Credit (Udhaar Khata)",
            desc: "Write down who owes you money. Send them WhatsApp reminders to pay faster."
        },
        {
            icon: <FileText size={32} className="text-green-500" />,
            title: "Invoices (Pakka Bill)",
            desc: "Create professional bills for big customers. Print them or save as PDF."
        },
        {
            icon: <BarChart2 size={32} className="text-red-500" />,
            title: "Analytics (Hisaab Kitab)",
            desc: "See how much money you made today. Check your total sales and profit."
        }
    ];

    return (
        <OwnerLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 text-gray-800">App Guide</h1>
                <p className="text-gray-600 mb-8 text-lg">Everything your shop can do, explained simply.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((f, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow flex items-start gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                {f.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{f.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 bg-indigo-50 p-8 rounded-2xl text-center">
                    <h2 className="text-2xl font-bold text-indigo-900 mb-4">Need Help?</h2>
                    <p className="text-indigo-700 mb-6">If you are stuck, just ask your helper or check this page again.</p>
                    <button className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors">
                        Contact Support
                    </button>
                </div>
            </div>
        </OwnerLayout>
    );
};

export default AppGuide;
