import React from "react";
import { MoveRight, Clock, Battery, Wind } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { yogaPlans } from "../data/yogaPlans";
import RefCard from "./ui/RefCard";

export const FlowSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-warm-50 to-lavender-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-800 mb-4 animate-fade-in">
            Guided <span className="text-sage-600">Flows</span>
          </h1>
          <p className="text-slate-500 max-w-2xl text-lg animate-fade-up">
            Pre-curated routines designed for your specific needs. Real-time AI form correction included.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {yogaPlans.map((plan, idx) => (
            <div key={plan.id} style={{ animationDelay: `${idx * 0.15}s` }} className="animate-fade-up">
              <RefCard 
                title={plan.title}
                text={
                  <>
                    <span style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>{plan.level} • {plan.duration}</span>
                    {plan.description}
                  </>
                }
                onViewMore={() => navigate(`/session/${plan.id}`)}
                socialButtons={[
                  { icon: <span style={{display: 'flex', alignItems: 'center', fontSize: '10px', gap: '2px'}}><Battery size={12}/>{plan.routine.filter(r => r.type === 'pose').length}</span> },
                  { icon: <span style={{display: 'flex', alignItems: 'center', fontSize: '10px'}}><Wind size={12}/></span> },
                  { icon: <Clock size={12}/> }
                ]}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
